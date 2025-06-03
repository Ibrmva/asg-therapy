import userModel from "../models/userModel.js";


export const getUserData = async (req, res) => {
    try {
        const userId = req.user.id; // Use userId from req.user

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            userData: {
                firstname: user.firstname,
                lastname: user.lastname,
                isAccountVerified: user.isAccountVerified,
            },
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
