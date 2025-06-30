# Deliverables
- Computer vision
    - QR code reading
        - Input: Camera feed
        - Output: Player and object ID
    - Human shape detection
        - Input: Camera feed
        - Output: Player hitbox on the screen (in pixels)   
- In-game server logic
    - Database updating (based on messages)    
- In-game User
    - Hit detection
    - Messaging logic
    - Interface
- Lobby and session
    - Joining and creating games (interface and logic)
    - Joining as a player or spectator (interface and logic)

# Database 
Fields:
- Player ID: Number
- Player health: Number between 0 and 5
- Player points: Number greater than 0

# Program flow
- The webpage is hosted on Render.
- User opens webpage on browser
- The user is assigned a player ID (sequentially)
- User selects either create game or join game
- If user selects create game:
    - A session ID is created and stored in a database.
    - The user is taken to a lobby screen showing:
        - A start game button
        - The current players in the lobby
- If the user selects join game:
    - The user is shown a list of open games and they select one
    - The user is prompted to join as a player or spectator
    - The user is then shown the lobby with the current players and a start game button.
- Then one of the users clicks the start game button
    - The game status for that session then updates to in-game
    - All the users in that lobby are shown their in-game interface.
        - The interface is their camera feed overlayed with a target symbol in the middle of the screen, their health and points at the top of the screen, and a shoot button in the bottom middle of their screen. 
    - The spectators default to seeing the interface of the first player to join the lobby but don't have a shoot button.
- Then the game has begun and players aim their phones at each other.
- A hit box appears around the people on your screen that are detected.
- Their QR codes are scanned automatically and linked to the detected people on the screen.
- The user presses the shoot button and if the target in the center of their screen is within a player's hitbox, then their device updates the database containing the players (and their health and points) using the player ID detected from the QR code.
- When players reach 0 HP they are shown the spectator screen.
- When the second last player reaches 0 HP then the game ends and the players are taken to a winning screen showing the order that each player was eliminated in.
    - There will be an exit button that takes them to the create or join game screen.


# Random notes:
This website will be hosted on Render (as opposed to Vercel). We'll give Render access to our github repo and it will give us a URL to access the website from. 