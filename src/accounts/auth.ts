import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia';
import type { Database } from "bun:sqlite";
import type { user } from '../../data/database.sqlite.ts';
import { log } from '../logging/index.ts';

export default function initAuth(db: Database) {
    const getUserQuery = db.query(`SELECT * FROM users WHERE username = $username;`);
    const createUserQuery = db.query(`INSERT INTO users (username, password) VALUES ($username, $password);`);

    return new Elysia({ prefix: '/auth' })
        .use(
            jwt({
                name: 'jwt',
                secret: process.env.secret || ""
            })
        )
        .guard(
            {
                body: t.Object({
                    username: t.String(),
                    password: t.String()
                })
            },
            (app) =>
                app
                    .post('/sign-up', async ({ body: { username, password }, jwt, cookie: { auth } }) => {
                        const user = getUserQuery.get({ $username: username }) as user | null;
                        if (user) {
                            return "User already exists"
                        }

                        try {
                            createUserQuery.run({ $username: username, $password: await Bun.password.hash(password) })

                            auth.set({
                                value: await jwt.sign({ username }),
                                httpOnly: true,
                                maxAge: 7 * 86400,
                                path: '/profile',
                            })

                            return `Signed up as ${username}`
                        } catch (e) {
                            log('Failed to sign up as ' + username);

                            return 'Failed to sign up'
                        }
                    })
                    .post(
                        '/sign-in',
                        async ({ body: { username, password }, jwt, cookie }) => {
                            const user = getUserQuery.get({ $username: username }) as user | null;
                            if (!user) {
                                return "No such user"
                            }

                            if (!(await Bun.password.verify(password, user.password))) {
                                return 'Incorrect password'
                            }

                            cookie.auth.set({
                                value: await jwt.sign({ username }),
                                httpOnly: false,
                                maxAge: 7 * 86400
                            })

                            return `Signed in as ${username}`
                        }
                    )
        )
        .guard(
            {
                beforeHandle: async ({ jwt: { verify }, cookie: { auth } }) => await verify(auth.value)
            },
            (app) =>
                app
                    .get('/profile', async ({ jwt: { verify }, cookie: { auth: { value } } }) => await verify(value))
                    .get('/sign-out', async ({ cookie: { auth } }) => {
                        auth.remove();

                        return 'Signed out';
                    })
        )
}