    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const EDGES = {
      '0,1': 'red', '0,2': 'green', '1,3': 'red', '2,4': 'green',
      '0,5': 'red', '0,6': 'green', '5,7': 'red', '7,9': 'red',
      '6,8': 'green', '8,10': 'green', '5,6': 'yellow',
      '5,11': 'red', '6,12': 'green', '11,12': 'yellow',
      '11,13': 'red', '13,15': 'red', '12,14': 'green', '14,16': 'green'
    };

    function resizeCanvas() {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);

    async function setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight },
          facingMode: 'user'
        },
        audio: false
      });
      video.srcObject = stream;
      return new Promise(resolve => {
        video.onloadedmetadata = () => {
          resizeCanvas();
          resolve(video);
        };
      });
    }

    function drawKeypoints(keypoints, threshold = 0.4) {
      for (const kp of keypoints) {
        if (kp.score > threshold) {
          const { x, y } = kp;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'lime';
          ctx.fill();
        }
      }
    }

    function drawSkeleton(keypoints, threshold = 0.4) {
      const keypointMap = keypoints.reduce((acc, kp, i) => {
        acc[i] = kp;
        return acc;
      }, {});
      for (const [edge, color] of Object.entries(EDGES)) {
        const [i, j] = edge.split(',').map(Number);
        const kp1 = keypointMap[i];
        const kp2 = keypointMap[j];
        if (kp1.score > threshold && kp2.score > threshold) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }

	async function detectPose(detector) {
	  ctx.clearRect(0, 0, canvas.width, canvas.height);
	  const poses = await detector.estimatePoses(video, { flipHorizontal: true });

	  for (const pose of poses) {
		const keypoints = pose.keypoints;
		drawKeypoints(keypoints);
		drawSkeleton(keypoints);

		// --- Compute average of high-confidence keypoints ---
		let totalX = 0;
		let totalY = 0;
		let count = 0;

		for (const kp of keypoints) {
		  if (kp.score > 0.4) {
			totalX += kp.x;
			totalY += kp.y;
			count++;
		  }
		}

		if (count > 0) {
		  const avgX = totalX / count;
		  const avgY = totalY / count;

		  // Draw the average point
			ctx.beginPath();
			ctx.arc(avgX, avgY, 6, 0, 2 * Math.PI);
			ctx.fillStyle = 'cyan';
			ctx.fill();

			// Draw a hitbox around the average
			// Get spread of keypoints
				const xs = [];
				const ys = [];

				for (const kp of keypoints) {
				  if (kp.score > 0.4) {
					xs.push(kp.x);
					ys.push(kp.y);
				  }
				}

				if (xs.length > 0 && ys.length > 0) {
				  const minX = Math.min(...xs);
				  const maxX = Math.max(...xs);
				  const minY = Math.min(...ys);
				  const maxY = Math.max(...ys);

				  const boxX = minX - 20; // Add padding
				  const boxY = minY - 20;
				  const boxWidth = (maxX - minX) + 40;
				  const boxHeight = (maxY - minY) + 40;

				  ctx.beginPath();
				  ctx.rect(boxX, boxY, boxWidth, boxHeight);
				  ctx.strokeStyle = 'orange';
				  ctx.lineWidth = 2;
				  ctx.stroke();
				}


		  console.log(`Person Center (${Math.round(avgX)}, ${Math.round(avgY)}), points used: ${count}`);
		}
	  }

	  requestAnimationFrame(() => detectPose(detector));
	}


    async function main() {
      await tf.setBackend('webgl');
      await tf.ready();
      await setupCamera();
      video.play();

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING
        }
      );

      detectPose(detector);
    }

    main();