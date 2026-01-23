import express from 'express'
import Verfiy_jwt from "../middleware/auth.middleware.js"
import { UpdateUsername , Profile} from '../Controller/user.controller.js'

const UserRouter = express.Router();
UserRouter.put('/update-username', Verfiy_jwt, UpdateUsername)
UserRouter.get('/profile', Verfiy_jwt, Profile)

export default UserRouter;