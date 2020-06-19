const express = require('express');
const { ApolloServer, PubSub } = require("apollo-server-express");
const http = require('http');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser')
const cloudinary = require('cloudinary')
const {
  fileLoader,
  mergeTypes,
  mergeResolvers,
} = require("merge-graphql-schemas");
const mongoose = require('mongoose');
require('dotenv').config();
const { authCheckMiddleware, authCheck } = require("./helpers/auth");

//publish and subscription
const pubsub =new PubSub()

//express server
const app = express();


//db
const db = async  ()=>{
   try{
      const success = await mongoose.connect(process.env.DATABASE,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
        useCreateIndex:true,
        useFindAndModify:false
      });
      console.log("db connected");
   }catch(error){
      console.log("db connetion failed!!",error)
   }
};
//execute database connection
db();

//graphql server
//types query,mutations,subscription

//midlleware
app.use(cors());
app.use(bodyParser.json({limit:'5mb'}))

//typedefs
const typeDefs=mergeTypes(fileLoader(path.join(__dirname,'./typedefs'))); //merges all the schemas present in typedefs

//resolvers
const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, "./resolvers"))
);



//graphql server
const apolloServer= new ApolloServer({
  typeDefs,
  resolvers,
  context:({req})=>({req,pubsub})
});
//applyMiddleware method connects apolloServer to a specific Http framework express
apolloServer.applyMiddleware({app})
//server
const httpServer=http.createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

app.get('/rest',authCheck,(req,res)=>{
  res.json({name:'shivam',
   age:18
 })
})


//cloudinary config
cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})



//upload
app.post('/uploadimages',authCheckMiddleware,(req,res)=>{
    cloudinary.uploader.upload(req.body.image,result=>{
      res.send({
        url:result.secure_url,
        public_id: result.public_id
      })
    },{
      public_id:`${Date.now()}`, //public name
      resource_type: 'auto' // JPEG,PNG
    })
})

//remove image
app.post('/removeimage',authCheckMiddleware,(req,res)=>{
  let image_id = req.body.public_id

  cloudinary.uploader.destroy(image_id,(error,result)=>{
     if(error) return res.json({success:false,error})
     res.send('ok')
  })
})

//port
httpServer.listen(process.env.PORT, () => {
  console.log(`server started at http://localhost:${process.env.PORT}`);
  console.log(
    `graphql server started at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`
  );
  console.log(
    `subscription is ready at http://localhost:${process.env.PORT}${apolloServer.subscriptionsPath}`
  );
});