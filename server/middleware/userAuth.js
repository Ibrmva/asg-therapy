import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: 'Not Authorized. Login again' });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!tokenDecode.id) {
            req.body.userId = tokenDecode.id;
        } else {
            return res.json({ success: false, message: 'Invalid token. Login again' });
        }

        next();
    } catch (error){
        res.json({ success: false, message: error.message });
    }
    

};

export default userAuth;

// import jwt from "jsonwebtoken";

// const userAuth = async (req, res, next) => {
//     try {
//         const { token } = req.cookies;

//         if (!token) {
//             return res.status.json({ success: false, message: 'Not Authorized. Login again' });
//         }

//         const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

//         if (!tokenDecode || !tokenDecode.id) {
//             return res.status(401).json({ success: false, message: 'Invalid token. Login again' });
//         }

//         req.user = { id: tokenDecode.id }; // Set userId in req.user
//         next();

//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// export default userAuth;
