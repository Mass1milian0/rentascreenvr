export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        return { msg: 'User not found', status: 400 };
    }
    event.context.user = session.user;
});