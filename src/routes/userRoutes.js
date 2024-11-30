const express=require("express");

const router=express.Router();

//Only admin can access this router
router.get("/admin",(req,res)=>{
    res.json({message:"Welcome Admin"});
});
//Both admin and child can access this router
router.get("/child",(req,res)=>{
    res.json({message:"Welcome Child"});
});
//All can access this router
router.get("/user",(req,res)=>{
    res.json({message:"Welcome User"});
});

module.exports = router;
