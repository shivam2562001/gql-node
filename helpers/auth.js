var admin = require("firebase-admin");

var serviceAccount = require("../config/fbServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "https://gqlreactnodejs.firebaseio.com",
});


exports.authCheck =async (req)=>{ //next=(f)=>f we give defaut value i.e. function(f)
   try{
     const currentUser = await admin
       .auth()
       .verifyIdToken(req.headers.authtoken);
     console.log('Current User',currentUser)
     return currentUser
   }catch(error){
     console.log('auth  check error',error)
     throw new Error('Invalid or expired token')
   }
};



exports.authCheckMiddleware = (req,res,next)=>{
   if(req.headers.authtoken){
     admin.auth().verifyIdToken(req.headers.authtoken)
     .then(result =>{
       next()
     })
     .catch(error => console.log(error))
   }else{
     res.json({error:'unauthorized'})
   }
}