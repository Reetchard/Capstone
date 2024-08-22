const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    databaseURL: "https://capstone40-project-default-rtdb.firebaseio.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();



  document.addEventListener("DOMContentLoaded", function() {
    // Reference to the trainers table in Firebase
    var trainersRef = database.ref('trainers');

    // Function to create HTML for each trainer
    function createTrainerCard(trainer) {
      return `
        <div class="service">
          <h3>${trainer.name}</h3>
          <p>${trainer.description}</p>
        </div>
      `;
    }

    // Fetch trainers data from Firebase
    trainersRef.on('value', function(snapshot) {
      var data = snapshot.val();
      var trainerProfilesContainer = document.getElementById('trainer-profiles');
      
      // Clear existing content
      trainerProfilesContainer.innerHTML = '';

      // Add each trainer profile to the container
      for (var key in data) {
        var trainer = data[key];
        trainerProfilesContainer.innerHTML += createTrainerCard(trainer);
      }
    });
  });
