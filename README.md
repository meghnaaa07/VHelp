# VHelp
Fast alerts, Faster help.

VHelp is a cloud-based real-time SOS system that allows users to send emergency alerts with live location. The alert is instantly synchronized to a volunteer dashboard using Firebase Realtime Database. Volunteers can access Google Maps location and provide immediate assistance. The system is scalable, serverless, and designed to reduce emergency response delay.

Tech Stacks.
HTML, CSS, JavaScript, Firebase, Git

Installation Commands.
bash
# Check Node and npm
node -v
npm -v

# Install Firebase CLI
npm install -g firebase-tools
firebase login
firebase init
firebase deploy

# Git commands
git init
git add .
git commit -m "Initial commit"
git remote add origin <repo-url>
git branch -M main
git push -u origin main

---

Screenshots.
<img width="1600" height="684" alt="image" src="https://github.com/user-attachments/assets/ab23b3c7-930a-4cfa-bf47-fb14e45fa0ac" />
<img width="1600" height="669" alt="image" src="https://github.com/user-attachments/assets/e85ff30b-16be-4b7a-be07-4f129465492c" />
<img width="1600" height="697" alt="image" src="https://github.com/user-attachments/assets/034fb07d-a41f-499e-91dc-5a2e60d3f0e1" />

Architecture Diagram.
+---------------------+
        |                     |
        |    Help Seeker      |
        |  (Web/Phone)       |
        |                     |
        +----------+----------+
                   |
                   | Sends SOS (lat/lng + timestamp)
                   v
        +---------------------+
        |                     |
        | Firebase Realtime   |
        | Database / Firestore|
        |                     |
        +----------+----------+
                   |
         +---------+---------+
         |                   |
         v                   v
+----------------+   +------------------+
| Volunteer Web  |   | Volunteer Web    |
| Dashboard Tab  |   | Dashboard Tab    |
| (Desktop/Phone)|   | (Desktop/Phone)  |
+----------------+   +------------------+
         |                   |
         | Reads SOS in real-|
         | time and clicks   |
         | "I'll help"       |
         v                   v
        +---------------------+
        | Firebase DB Update  |
        | status: acknowledged|
        +---------------------+
                   |
                   v
          Help Seeker Dashboard
          receives live update
          "Volunteer on the way!"

Team Members.
Shivani S Nair
Meghna Rajesh Vichattu
