// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7HWLl3ptc4Yxr2KFBvufAbKJR7mMJ0L8",
  authDomain: "eva-wardrobe.firebaseapp.com",
  projectId: "eva-wardrobe",
  storageBucket: "eva-wardrobe.appspot.com",
  messagingSenderId: "769773696500",
  appId: "1:769773696500:web:5243f065acc0d318a3f5a1",
  measurementId: "G-WQWEDGY6G0"
};

firebase.initializeApp(firebaseConfig);

var ui = new firebaseui.auth.AuthUI(firebase.auth());
const db = firebase.firestore();
var storage = firebase.storage();
var storageRef = storage.ref();

var itemArray = {}


function loadGoogle() {
    var uiConfig = {
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
            // User successfully signed in.
            // Return type determines whether we continue the redirect automatically
            // or whether we leave that to developer to handle.
            console.log('Signed in!')
            return true;
            },
            // uiShown: function() {
            // // The widget is rendered.
            // // Hide the loader.
            // document.getElementById('sign-out').style.display = 'none';
            // document.getElementById('my-closet').style.display = 'none';
            // }
        },
        // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
        signInFlow: 'popup',
        signInSuccessUrl: './closet.html',
        signInOptions: [
            // Leave the lines as is for the providers you want to offer your users.
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ],
        // // Terms of service url.
        // tosUrl: '<your-tos-url>',
        // // Privacy policy url.
        // privacyPolicyUrl: '<your-privacy-policy-url>'
    };
    
    // The start method will wait until the DOM is loaded.
    console.log('loading google')
    ui.start('#firebaseui-auth-container', uiConfig);
}

function signOut() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        console.log("Signed out!")
        window.location='./index.html';
      }).catch((error) => {
        // An error happened.
        console.log("Error signing out")
      });
}

function getStarted() {
    console.log('get started')
    var user = firebase.auth().currentUser;
    if (user) {
        window.location='./closet.html';
        return;
    }
    loadGoogle();
}

function deleteItem(itemID) {
    var user = firebase.auth().currentUser;
    itemRef = db.collection("users").doc(user.email).collection("items").doc(itemID)

    itemRef.get().then((doc) => { 
        return String(doc.data().storageID);
    }).then((storageID) => {
        // delete image from storage
        var imageRef = storageRef.child('images/'+user.email+'/'+storageID);
        imageRef.delete().then(() => {
            console.log("Image successfully deleted! " + storageID)
        })
    }).then(() => {
        // delete document from firestore
        itemRef.delete().then(() => {
            console.log("Document successfully deleted! "+itemID);
            document.getElementById(itemID).outerHTML = "";
            delete itemArray[itemID];
        })
    }).catch((error) => {
        console.error(error);
    });
}

function signInEmail() {
    var email = document.getElementById('email-input').value;
    console.log(email)
    var actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: 'https://eva-wardrobe.web.app/closet.html',
        // This must be true.
        handleCodeInApp: true,
        // iOS: {
        //   bundleId: 'com.example.ios'
        // },
        // android: {
        //   packageName: 'com.example.android',
        //   installApp: true,
        //   minimumVersion: '12'
        // },
        // dynamicLinkDomain: 'example.page.link'
      };
    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
      .then(() => {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', email);
        document.getElementById('send-email').innerHTML=`Email sent!`
        // ...
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(error);
      });
        // Confirm the link is a sign-in with email link.
    if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
        // Additional state parameters can also be passed via URL.
        // This can be used to continue the user's intended action before triggering
        // the sign-in operation.
        // Get the email if available. This should be available if the user completes
        // the flow on the same device where they started it.
        var email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        email = window.prompt('Please provide your email for confirmation');
        }
        // The client SDK will parse the code from the link for you.
        firebase.auth().signInWithEmailLink(email, window.location.href)
        .then((result) => {
            // Clear email from storage.
            window.localStorage.removeItem('emailForSignIn');
            // You can access the new user via result.user
            // Additional user info profile not available via:
            // result.additionalUserInfo.profile == null
            // You can check if the user is new or existing:
            // result.additionalUserInfo.isNewUser
        })
        .catch((error) => {
            console.log(error);
            // Some error occurred, you can inspect the code: error.code
            // Common errors could be invalid email and invalid or expired OTPs.
        });
    }
    
}

firebase.auth().onAuthStateChanged(function (user) {
    console.log("Auth state changed")
    if (user) {
        if (window.location.href=='./closet.html') {
            myClosetSelected();
        }
        document.getElementById('sign-in').style.display='none';
        document.getElementById('sign-out').style.display = 'flex';
        document.getElementById('my-closet').style.display = 'flex';

        document.getElementById('sign-in-collapse').style.display='none';
        document.getElementById('sign-out-collapse').style.display = 'flex';
        document.getElementById('my-closet-collapse').style.display = 'flex';
    } else {
        document.getElementById('sign-in').style.display = 'flex'
        document.getElementById('sign-out').style.display = 'none';
        document.getElementById('my-closet').style.display = 'none';

        document.getElementById('sign-in-collapse').style.display = 'flex'
        document.getElementById('sign-out-collapse').style.display = 'none';
        document.getElementById('my-closet-collapse').style.display = 'none';
    }
 });

function getCloset() {
    var user = firebase.auth().currentUser;
    itemArray = {}
    console.log(user.email)
    if (user==null) {
        console.log("No user logged in");
        return;
    }
    var html=``
    // var html = `
    // <div class="col">
    //     <div class="card border-light" style="width: 10rem;" onmouseenter="itemInfo(1,'Pants',1)" onmouseleave="itemInfo2(1)">
    //         <img src="img/crop.webp" class="card-img" alt="...">
    //         <div id="1"></div>
    //         <div id="1x" style="position:absolute"></div>
    //     </div>
    // </div>
    // <div class="col">
    //     <div class="card border-light" style="width: 10rem;" onmouseenter="itemInfo(2,'Pants',2)" onmouseleave="itemInfo2(2)">
    //         <img src="img/pants.webp" class="card-img" alt="...">
    //         <div id="2"></div>
    //         <div id="2x" style="position:absolute"></div>
    //     </div>
    // </div>
    // `
    var n=3;
    // db.collection("users").where("Email", "array-contains", user.email).get()
    // .then((querySnapshot) => {
    //     querySnapshot.forEach((doc) => {
    //         console.log('Parent Document ID: ', doc.id);
            db.collection("users").doc(user.email).collection("items").get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    // console.log(`${doc.id} => ${doc.data()}`);
                    var id = String(doc.id)
                    itemArray[id] = false
                    html = html + `
                    <div class="col" id='${doc.id}'>
                        <div id='${doc.id}_card' class="card" style="width: 10rem;border:none" onclick="selectItem('${doc.id}')" onmouseenter="itemInfo(${n},'${doc.data().title}','${doc.id}')" onmouseleave="itemInfo2(${n})">
                            <img src="${doc.data().imageURL}" class="card-img" alt="...">
                            <div id=${n}></div>
                            <div id='${doc.id}_x' style="position:absolute"></div>
                        </div>
                    </div>
                    `
                    n=n+1;
                });
            }).then(() => {
                document.getElementById("closetSpace").innerHTML = html
            }).catch((error) => {
                console.log(error);
            });
    //     });
    // })
    // .catch((error) => {
    //     console.log("Error getting documents: ", error);
    // });
}

function itemInfo(itemID, itemName, docID) {
    document.getElementById(itemID).innerHTML = 
    `
    <div class="card-img-overlay">
        <p class="card-text card-img-bottom"><small>${itemName}</small></p>
    </div>
    `
}
function itemInfo2(itemID) {
    document.getElementById(itemID).innerHTML = ``
}

function editItems() {
    doneSelect()
    for (item in itemArray) {
        document.getElementById(String(item) + "_card").onclick = null
        document.getElementById(String(item) + "_x").innerHTML=
        `
        <button type="button" onclick="deleteItem('${item}')" class="btn-close" aria-label="Close"></button>
        `
    }
    document.getElementById("edit-items").innerHTML = "Done"
    document.getElementById("edit-items").onclick = done_editItems
}

function done_editItems() {
    for (item in itemArray) {
        const cardID = String(item)
        document.getElementById(String(item) + "_card").onclick = function () {
            selectItem(cardID)
        }
        document.getElementById(String(item) + "_x").innerHTML=``
    }
    document.getElementById("edit-items").innerHTML = "Edit"
    document.getElementById("edit-items").onclick = editItems
}

function doneSelect() {
    for (item in itemArray) {
        itemArray[item]=false;
        document.getElementById(String(item)+'_card').style.border = "none"
    }
    document.getElementById('save-outfit').style.visibility = "hidden";
    document.getElementById('done-select').style.visibility = "hidden";
}

function selectItem(itemID) {
    if (itemArray[itemID]==true) {
        itemArray[itemID]=false;
        document.getElementById(String(itemID)+'_card').style.border = "none"
    } else {
        itemArray[itemID]=true;
        document.getElementById(String(itemID)+'_card').style.border = "2px solid black"
    }
    for (item in itemArray) {
        if (itemArray[item]==true) {
            document.getElementById('save-outfit').style.visibility = "visible";
            document.getElementById('done-select').style.visibility = "visible";
            break
        }
        document.getElementById('save-outfit').style.visibility = "hidden";
        document.getElementById('done-select').style.visibility = "hidden";
    }
}

function saveOutfit() {
    var saveArray = []
    for (item in itemArray) {
        if (itemArray[item]==true) {
            saveArray.push(item)
            document.getElementById(item+'_card').style.border = "none"
        }
    }
    document.getElementById('save-outfit').style.visibility = "hidden";
    document.getElementById('done-select').style.visibility = "hidden";
    // save outfit to firebase
    var user = firebase.auth().currentUser;
    console.log("Save array, ", saveArray)
    db.collection("users").doc(user.email).collection("outfits").doc().set({
        outfit: saveArray
    })
    .then(() => {
        console.log("Document successfully written!");
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
    });
}

function myClosetSelected() {
    document.getElementById("edit-items").style.visibility="visible"
    var current = document.getElementsByClassName("active");
    current[0].className = current[0].className.replace(" active", "");
    document.getElementById("all-closet").className += " active"
    getCloset()
}

async function savedOutfitsSelected() {
    document.getElementById("edit-items").style.visibility="hidden"
    var current = document.getElementsByClassName("active");
    current[0].className = current[0].className.replace(" active", "");
    document.getElementById("outfits").className += " active"

    // html=`<div class="col-3" style="padding:0px">
    // <div id="carousel2" class="carousel slide carousel-fade">
    //   <div class="carousel-inner">
    //     <div class="carousel-item active">
    //       <div class="row">
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/crop.webp" class="img-fluid">
    //           </div>
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/crop.webp" class="img-fluid">
    //           </div>
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/crop.webp" class="img-fluid">
    //           </div>
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/crop.webp" class="img-fluid">
    //           </div>
    //       </div>
    //     </div>
    //     <div class="carousel-item">
    //       <div class="row">
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/pants.webp" class="img-fluid">
    //           </div>
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/pants.webp" class="img-fluid">
    //           </div>
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/pants.webp" class="img-fluid">
    //           </div>
    //           <div class="col-3 col-md-6" style="padding:0px">
    //               <img src="img/pants.webp" class="img-fluid">
    //           </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
    // </div>
    // `

    // load saved outfits from firebase
    var user = firebase.auth().currentUser;
    var html=``
    var outfitArray=[]
    await db.collection("users").doc(user.email).collection("outfits").get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            outfitArray.push(doc.data().outfit)
        });
        return outfitArray
    }).catch((error) => {
        console.log(error);
    });
    for (let i = 0; i < outfitArray.length; i++) {
        var outfit = outfitArray[i]
        html = html + `
        <div class="col-md-2 border rounded" style="margin:10px;padding:0px;">
            <div id="carousel${i}" class="carousel slide">
            <div class="carousel-inner">
        `
        for (let n = 0; n < outfit.length; n++) {
            var itemID = outfit[n]
            if (n%4==0) {
                html=html+ `<div id="outfit${n}${i}" class="carousel-item">
                <div class="row">`
            }
            await db.collection("users").doc(user.email).collection("items").doc(itemID).get()
            .then((doc) => {
                if (doc.data()) { // if doc has not been deleted (TO DO)
                    html = html + `
                    <div class="col-3 col-md-6" style="padding:0px">
                        <img src="${doc.data().imageURL}" class="img-fluid">
                    </div>
                    `
                }
            }).then(()=> {
                if (n%4==3 | n==outfit.length-1) {
                    html=html+`</div></div>`
                }
            }).catch((error) => {
                console.log(error);
            });
        }
        if (outfit.length>4) {
            html = html+`</div>
            <a class="carousel-control-prev" href="#carousel${i}" role="button" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </a>
            <a class="carousel-control-next" href="#carousel${i}" role="button" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </a>
            </div></div>`
        } else {
            html = html+`</div></div></div>`
        }
    }
    document.getElementById("closetSpace").innerHTML = html
    
    for (let i = 0; i < outfitArray.length; i++) {
        document.getElementById("outfit0"+String(i)).className += " active"
        var myCarousel = document.querySelector('#carousel'+String(i))
        var carousel = new bootstrap.Carousel(myCarousel, {
            interval:2000
        })
        var id="#carousel"+String(i);
        $(id).carousel('pause');
        $(id).on("mouseover",function() {
            $(this).carousel('cycle');
          }).on("mouseleave", function() {
            $(this).carousel('pause');
          });
    }
    // document.getElementById("closetSpace").innerHTML = html
    // var myCarousel2 = document.querySelector('#carousel2')
    // var carousel = new bootstrap.Carousel(myCarousel2)
    // $('#carousel2').carousel("cycle");
    // var myCarousel3 = document.querySelector('#carousel3')
    // var carousel = new bootstrap.Carousel(myCarousel3)
    // $('#carousel3').carousel("cycle");
    
}

function submitForm() {
    const form = document.getElementById("contact-form");
    const name = form.elements['name'].value;
    const email = form.elements['email'].value;
    var message = form.elements['message'].value;
    if (message=="") {
        message=null
    }
    db.collection("contact-form").doc().set({
        name: name,
        email: email,
        message: message,
        date: new Date()
    })
    .then(() => {
        document.getElementById('contact-form').reset();
        document.getElementById('submit-form-row').innerHTML=`<p style="color:gray">We'll have you stylin' soon. Thanks!</p>`;
        console.log("Document successfully written!");
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
    });
}