 async function leave(){
            window.location.href = "index.html";
        }

    window.onload = () => {
      confetti({
        particleCount: 2000,
        spread: 1000,
        origin: { y: 0.35 }
      });
    };

