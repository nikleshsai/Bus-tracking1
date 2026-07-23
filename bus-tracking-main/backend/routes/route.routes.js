const express=require("express");

const router=express.Router();

const busController=require("../controllers/bus.controller");

router.get("/",busController.getAllBuses);

module.exports=router;