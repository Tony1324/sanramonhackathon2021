document.querySelector("#sign-in").addEventListener("click", ()=>{
    if(document.querySelector("#sign-in-pop-up").style.display != "flex"){
        document.querySelector("#sign-in-pop-up").style.display = "flex"
    }else{
        document.querySelector("#sign-in-pop-up").style.display = "none"
    }
})
let unsub;
firebase.auth().onAuthStateChanged((user)=>{
    if(user){
        window.user=user
        document.querySelector("#sign-in").innerHTML = "logged in"
        document.querySelector("#firebaseui-auth-container").style.display = "none"
        document.querySelector("#sign-out").style.display = "flex"
        window.uid = user.uid
        unsub?.()
        ubsub = firebase.firestore().collection('users').doc(uid).onSnapshot(doc => {
            if(!doc.exists) {
                firebase.firestore().collection('users').doc(uid).set({
                    score:0
                }, {merge: true}).catch((error) => {
                    console.error("error:" + error)
                })
            }else{
                window.userDoc = doc
                document.querySelector("#score").innerHTML = "Score: " + doc.data().score
            }
        })

    }else{
        unsub?.()
        document.querySelector("#sign-in").innerHTML = "log in"
        document.querySelector("#firebaseui-auth-container").style.display = "block"
        document.querySelector("#sign-out").style.display = "none"
    }
})


document.querySelector("#website-search").addEventListener("keyup", (e)=>{
    if(e.key == 'Enter' || e.keyCode == 13){
        if(!validURL(document.querySelector("#website-search").value)){alert("please enter a valid url. E.g https://google.com");return}
        firebase.firestore().collection("reviews")
            .where("site","==",document.querySelector("#website-search").value)
            .get()
            .then(documents=>{
                let docs = documents.docs
                if(docs.length == 0){
                    document.querySelector("#search-results").innerHTML = "no results yet."
                }else{
                    document.querySelector("#search-results").innerHTML = ""
                    for(doc of docs){
                        document.querySelector("#search-results").innerHTML += `
                            <div class="rating">
                                <h4>Bias:</h4>
                                <div class="bias-meter">
                                    <div class="bias-label" style="left: ${(doc.data().bias + 1)*50}%">
                                    </div>
                                </div>
                                <h4>Comments:</h4>
                                <p>${doc.data().comments.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("\"","&quot;").replaceAll("'","&#039;")}</p>
                            </div>
                        `
                    }
                }
                console.log(docs)
            })
    }
})

let isRequest = false

function writeRating(){
    if(user){
        document.querySelector('#rating-composer').style.display='block';
        document.querySelector('#rating-url').value = document.querySelector('#website-search').value
    }else{
        document.querySelector("#sign-in-pop-up").style.display = "block"
    }
}


function submitRating(){
    let url = document.querySelector("#rating-url")?.value
    let bias = parseInt(document.querySelector("#bias-input")?.value)/100
    let comments = document.querySelector("#rating-comments")?.value

    if(!url){alert("please enter an url")}
    else if(!validURL(url)){alert("please enter a valid url. E.g https://google.com")}
    else if(!comments){alert("please write a comment")}
    else{
        firebase.firestore().collection("reviews").add({
            bias:bias,
            comments:comments,
            site:url
        }).then(()=>{
            document.querySelector("#rating-composer").style.display="none"
            document.querySelector("#rating-url").value = null
            document.querySelector("#bias-input").value = 0
            document.querySelector("#rating-comments").value = null
        })
        console.log(userDoc.data().score)
        firebase.firestore().collection("users").doc(uid).update({
            score: userDoc.data().score+(isRequest? 2 : 1)
        })
    }
    isRequest = false
}

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return !!pattern.test(str);
}

function cancelRating(){
    document.querySelector("#rating-composer").style.display="none"
    document.querySelector("#rating-url").value = null
    document.querySelector("#bias-input").value = 0
    document.querySelector("#rating-comments").value = null
    isRequest = false
}


function addRequest(){
    if(user){
        let url = prompt("Enter a url review request")
        if(url.trim() && validURL(url)){
            firebase.firestore().collection("requests").add({
                site: url.trim()
            })
        }else{
            alert("please enter a valid url. E.g https://google.com")
        }
    }else{
        document.querySelector("#sign-in-pop-up").style.display = "block"
    }
}

function openRequest(url){
    open(url)
    writeRating()
    document.querySelector("#rating-url").value = url
    isRequest = true
}

firebase.firestore().collection("requests").onSnapshot(snapshot=>{
    docs = snapshot.docs
    document.querySelector("#requests-results").innerHTML = ""
    for(doc of docs){
        document.querySelector("#requests-results").innerHTML += `
            <div class="request horizontal">
            <h4>${doc.data().site}</h4>
            <div class="spacer"></div>
            <button class="open-request" onclick="openRequest('${doc.data().site}')">Open</button> 
            </div>
        `
    }
})
