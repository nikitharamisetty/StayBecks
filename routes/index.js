//import {alert} from 'node-popup';
var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');

var multer = require('multer');
var monk = require('monk');
var db = monk('localhost:27017/staybecks');
var collection = db.get('properties');
var users = db.get('users');
////image upload
router.use(express.static(__dirname+'./public/'));




var Storage = multer.diskStorage({
  destination : './public/images/',
  filename:(req,file,cb)=>{
    cb(null,file.originalname)
  }
});

  var upload = multer({
    storage:Storage
   
  }).single('file');


////image upload
router.get('/', function(req, res) {
    console.log("ehdsj")  
    res.render('login');
});

router.get('/index', function(req, res) {
  collection.find({}, function(err, properties){
    if (err) throw err;   
    res.render('index',{properties:properties})
  });
});

router.get('/properties',function(req, res) {
  console.log("uhhgirw");
  collection.find({}, function(err, properties){
       if (err) throw err;
        res.render('properties',{properties : properties})
        //res.json(properties)
    });    
});


router.get('/properties/:id', function(req, res) {
  collection.findOne({ _id: req.params.id }, function(err, property){
    if (err) throw err;
      //res.render('show', { properties: prop });
      res.render('show', { property: property });
    //res.json(result);
  });
});

router.post('/comments/:id',function(req,res){
  console.log(req.params.id)
  console.log(req.body.comments)
  collection.findOneAndUpdate({_id: req.params.id },
    {$push:{comments :req.body.comments}});
  res.redirect('/properties/'+req.params.id);
});


router.get('/fav/Add/:id', function(req, res) {
  const id = req.cookies['userId']
  console.log(id)
  console.log(req.params.id)
  users.findOneAndUpdate({_id: id},{$push:{fav :req.params.id}});
  res.redirect('/user_properties')

});

router.get('/fav/Delete/:id', function(req, res) {
  const id = req.cookies['userId']
  console.log(id)
  console.log(req.params.id)
  users.findOneAndUpdate({_id: id},{$pull:{fav :req.params.id}});
  res.redirect('/fav')

});


router.get('/new', function(req, res){
   res.render('new');
});



router.post('/properties',  upload,function(req, res) {
	//var collection = db.get('properties')
	collection.insert({ 
		title: req.body.title,
		//location: req.body.location,
    bedrooms: req.body.bedrooms,
    amenities: req.body.amenities,
    price_per_night: req.body.price,
    nightly_fee: req.body.nightlyfee,
    cleaning_fee: req.body.cleaningfee,
    service_fee: req.body.servicefee,
    rating: req.body.rating,
		//img: req.body.image,
    image: req.file.filename,
		description:req.body.desc
	}, function(err, property){
		if (err) throw err;
		res.redirect('/properties');
	});
});

router.get('/user_index', function(req, res) {
  collection.find({}, function(err, properties){
    if (err) throw err;
    //res.render('login');
    res.render('user_index',{properties:properties})
    //res.json(properties);
  });
});
router.get('/user_properties', function(req, res) {
  collection.find({}, function(err, properties){
       if (err) throw err;
        res.render('user_properties',{properties : properties})
        //res.json(properties)
    });    
});


///////

router.post('/signup', async(req, res) =>{
	//var collection = db.get('properties')

  const saltPassword = await bcrypt.genSaltSync(10);
  const securePassword = await bcrypt.hashSync(req.body.password, saltPassword);
  const user_type  = req.body.user_type;
   console.log(user_type)
	users.insert({ 
    first_name : req.body.first_name,
    last_name : req.body.last_name,
		email: req.body.email,
    //password: req.body.password
    password: securePassword,
    user_type: user_type
    
  }, function(err, data){
		if (err) throw err;
		res.redirect('/signup');
	});
});
//////


router.get('/signup', function(req, res) {
  
    res.render('signup');

});

router.get('/fav', function(req, res) {
  const id = req.cookies['userId'];
  let arr = [];
  users.find({_id : id}, function(err, data){arr=data[0].fav; 
  //console.log(users.find({_id : id}, function(err, data){return data}));
  if(data[0].user_type =="host"){
    res.redirect('/login');
  }
  console.log(arr);
  collection.find({_id : {$in : arr}}, function(err, properties){ 
    if (err) throw err;
    console.log(properties);
     res.render('fav',{properties : properties})
  
    
 });    
});
 

});

router.post('/login',async(req, res)=>{
  users.findOne({ email: req.body.email },
    function(err,data){
     // console.log(data)
      const validPassword = bcrypt.compareSync(req.body.password, data.password);
      console.log(validPassword)
      const id = data._id
     
      if(validPassword){

        res.cookie('userId',id);
        
        if(data.user_type == 'host'){
          res.redirect('/index')
        }
        else if(data.user_type == 'tenant'){
          res.redirect('/user_index')         
        }
      }
      if(!validPassword){
  
        res.redirect('/login');
      }         
    });
  
});

router.get('/login', function(req, res) {
  
  res.render('login');

});

router.delete('/properties/:id', function(req, res) {
  let collection = db.get('properties');
  console.log(req.params.id);
  //console.log(collection);
  collection.remove({ "_id": req.params.id });
  res.redirect('/properties');
});

//Update a particular property

router.put('/properties/:id', function(req, res) {

  let collection = db.get('properties')
  collection.updateOne({"_id": req.params.id},
  {
    title: req.body.title,
		//location: req.body.location,
    bedrooms: req.body.bedrooms,
    amenities: req.body.amenities,
    price_per_night: req.body.price,
    nightly_fee: req.body.nightlyfee,
    cleaning_fee: req.body.cleaningfee,
    service_fee: req.body.servicefee,
    rating: req.body.rating,
		img: req.body.image,
		description:req.body.desc
  }, (err, data) => res.json(data));

  console.log(req.params.id);
  res.redirect('/properties')

});
router.get('/properties/search', async (req, res) => {
  const { searchname } = req.query;
  console.log(searchname);
  const prop = await collection.find({ $text: { $search: { bedrooms: searchname } } });
  console.log(prop);
  res.render('prop', { prop });
 
})

router.put('/properties/:id/update', function(req, res) {

  let collection = db.get('properties');
  console.log(req.params.id);
  console.log("reaching till here!!! something wrong with collection.updateOne!!!!");
  //collection.updateById(req.params.id, {price_per_night: req.body.price});
  console.log("reaching till here!!! something wrong with collection.updateOne!!!!");
  collection.findOneAndUpdate({_id: req.params.id},
  {$set: {
    title: req.body.title,
		location: {City: req.body.location},
    bedrooms: req.body.bedrooms,
    amenities: req.body.amenities,
    price_per_night: req.body.price,
    nightly_fee: req.body.nightlyfee,
    cleaning_fee: req.body.cleaningfee,
    service_fee: req.body.servicefee,
    rating: req.body.rating,
		img: req.body.image,
		description:req.body.desc
  }});

  console.log(req.params.id);
  res.redirect('/properties');
});

router.get('/properties/:id/edit', function(req, res){
  collection.findOne({ _id: req.params.id }, function(err, property){
    if (err) throw err;
      //res.render('show', { properties: prop });
      res.render('update', { property: property });
    
  });
});
router.get('/reservations/:id', function(req, res) {
  res.cookie('propertyId',req.params.id);
  res.render('reservations',{data :{propertyId : req.cookies['propertyId'], visibility : 'hidden'}});

});

router.post('/reservations/:id', function(req, res) {
  const prop_id = req.cookies['propertyId'];
  var checkin = req.body.checkin;
  var checkout = req.body.checkout;

  let reservations = db.get('reservations');

  var days = [];
  for(var d=new Date(checkin); d<=new Date(checkout);d.setDate(d.getDate()+1)){
    days.push(new Date(d).toString());
  }

  console.log(days.includes(new Date(checkin).toString()));

  collection.findOne({_id: prop_id},function(err, prop){
    var unavailableDates = prop.unavailableDates;
    console.log(prop.unavailableDates)
    const intersection = days.filter((x) => unavailableDates.includes(x));
    console.log(intersection);
    if(intersection.length != 0){
      //popup.alert("Unavailable at selected dates! please choose different dates");
      res.render('reservations',{data :{propertyId : req.cookies['propertyId'], visibility : 'visible'}});
    }
    else{
      collection.findOneAndUpdate({_id: req.params.id },
        {$push:{unavailableDates : {$each : days}}});
       
        collection.find({}, function(err, properties){
         if (err) throw err;
          res.render('user_properties',{properties : properties})
          //res.json(properties)
         });
         
         reservations.insert({
          userId: req.cookies['userId'],
          propId: prop_id,
          checkin: new Date(checkin).toString(),
          checkout: new Date(checkout).toString()
         })


         console.log(prop_id);
         reservations.findOne({userId: req.cookies['userId']}, function(err, reser){
          users.findOneAndUpdate({_id: reser.userId}, {$push:{reservations : reser._id}});
         })
     

    }
    
  });
  
  
});

router.get('/mybookings', function(req, res) {
  const id = req.cookies['userId'];
  let arr = [];
  let reservations = db.get('reservations');
  users.find({_id : id}, function(err, data){arr=data[0].reservations; 
  //console.log(users.find({_id : id}, function(err, data){return data}));
  if(data[0].user_type =="host"){
    res.redirect('/login');
  }

  var reser = [];

  reservations.find({_id : {$in : arr}}, function(err, data){
    reser = data;
  

  console.log("reser");
  console.log(reser);

  var propids = [];
  for(var i=0;i<reser.length;i++){
    propids.push(reser[i].propId);
  }
  console.log("propids " + propids);
  

  
  console.log(arr);
  collection.find({_id : {$in : propids}}, function(err, properties){ 
    if (err) throw err;
    console.log(properties);
     res.render('mybookings',{data:{properties : properties, reservation: reser}})
  
    
 });
});    
});
});

router.get('/cancelReservation/:id', function(req, res){
  console.log("ferfe")
  var currdate = new Date();
  var reservation = db.get('reservations');

  reservation.findOne({_id:req.params.id}, function(err, data){
    console.log(data)
    var checkin = Date.parse(data.checkin)
    var diff = Math.abs(checkin - currdate);
    const hrs = Math.ceil(diff/(1000*60*60));
    console.log(hrs);

    if(hrs>48){
      //delete
      reservation.remove({_id: req.params.id});
      users.findOneAndUpdate({_id: req.cookies['userId']},{$pull:{reservations :req.params.id}});
      res.redirect(req.get('referer'));
    }
    else{
      //cant delete
      res.redirect('/mybookings')
      //res.render('mybookings',{data:{properties : properties, reservation: reser}})


    }
  })

})


module.exports = router;
