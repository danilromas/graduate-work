const { prisma } = require("../prisma/prisma-client");
const bcrypt = require('bcryptjs');
const jdenticon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const UserController = {
    register: async(req, res) => {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        try {
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (existingUser) {
                return res.status(400).json({ error: 'Пользователь уже существует' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const png = jdenticon.toPng(name, 200);
            const avatarName = `${name}_${Date.now()}.png`;
            const avatarPath = path.join(__dirname, '../uploads', avatarName);
            fs.writeFileSync(avatarPath, png);

            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: `/uploads/${avatarName}`
                }
            });

            res.json(user);
        } catch (error) {
            console.error('error in register', error);
            res.status(500).json({ error: 'Ошибка 500' });
        }
    },
    login: async(req, res) => {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        try {
            const user = await prisma.user.findUnique ({where: {email}})
            if (!user){
                return res.status(400).json({ error: 'Неверный логин или пароль' });
            }

            const valid = await bcrypt.compare(password, user.password);

            if (!valid) {
                return res.status(400).json({ error: 'Неверный логин или пароль' });
            }

            const token = jwt.sign(({ userId: user.id }), process.env.SECRET_KEY)

            res.json({ token })
        } catch (error) {
            console.error('error in login', error);
            res.status(500).json({ error: 'Ошибка 500' });
        }
    },
    getUserById: async(req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
            const user = await prisma.user.findUnique({
                where : {id},
                include: {
                    followers: true,
                    following: true
                }
            })

            if (!user){
                return res.status(400).json({ error: 'Пользователь не найден' });
            }

            const isFollowing = prisma.follows.findFirst({
                where: {
                    AND: [
                        { followerId: userId },
                        {followingId : id }
                    ]
                }
            })
            res.json({...user, isFollowing: Boolean(isFollowing)})
        } catch (error) {
            console.error('error in current', error);
            res.status(500).json({ error: 'Ошибка 500' });
        }
    },
    updateUser: async(req, res) => {
        const {id } = req.params;
        const {email, name, dateOfBirth, bio, location} = req.body;

        let filePath;

        if (req.file && req.file.path) {
            filePath = req.file.filePath
        }

        if (id !== req.user.userId) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        try {
            if(email) {
                const existingUser = await prisma.user.findFirst({
                    where: {email: email }
                })

                if (existingUser && existingUser.id !== id) {
                    return res.status(400).json({ error: 'Почта уже существует' });
                }
            }

            const user = await prisma.user.update({
                where: { id },
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}`: undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined,
                }
            })

            res.json(user);
        } catch (error) {
            console.error('error in update user', error);
            res.status(500).json({ error: 'Ошибка 500' });
        }
    },
    current: async(req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.userId
                },
                include: {
                    followers: {
                        include: {
                            follower: true
                        }
                    },
                    following: {
                        include: {
                            following: true
                        }
                    }
                }
            })

            if (!user) {
                return res.status(400).json({error:"Не удалось никого найти"})
            }

            res.json(user)
        } catch (error) {
            console.error('error in current', error);
            res.status(500).json({ error: 'Ошибка 500' });
        }
    },
};

module.exports = UserController;