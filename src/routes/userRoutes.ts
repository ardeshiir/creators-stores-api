import {Router} from 'express';
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser, searchUsers, filterUsers, exportUsers,
} from '../controllers/userController';

const router = Router();

router.post("/", createUser);

router.get("/", getUsers);

router.get("/search",  searchUsers);

router.get('/filter', filterUsers);

router.get('/export', exportUsers)

router.get("/:id", getUserById);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);




export default router;