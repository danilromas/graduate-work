const { prisma } = require("../prisma/prisma-client");


const CommentController = {
    createComment: async (req, res) => {
        const { postId, content} = req.body;
        const userId = req.user.userId;

        if (!postId || !content ){
            return res.status(401).json({error : 'Все поля обязательны'})
        }

        try {
            const comment = await prisma.comment.create({
                data: {
                    postId,
                    userId,
                    content
                }
            })

            res.json(comment);
        } catch (error) {
            console.error('Create comment error', );
            res.status(500).json({error: 'server error'})
        }
    },
    deleteComment: async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;

        try {
           const comment = await prisma.comment.findUnique({ where: { id } });
           
           if(!comment){
                return res.status(401).json({error : 'Не найден комментарий'})
           }

           if (comment.userId !== userId) {
                return res.status(403).json({error : 'Нет доступа'})
           }

           await prisma.comment.delete({where: { id } });

           res.json(comment)
        } catch (error) {
            console.error('delete comment error', error);
            res.status(500).json({error: 'server error'})
        }
    }
}
module.exports = CommentController;