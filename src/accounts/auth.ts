import { jwt } from '@elysiajs/jwt'
import { Cookie, Elysia, t } from 'elysia';
import type { Database } from "bun:sqlite";
import type { user } from '../../data/database.sqlite.ts';
import { log } from '../logging/index.ts';
import { error, type ErrorResponse } from '../response/error.ts';

export default function initAuth(db: Database) {
    const getUserQuery = db.query(`SELECT * FROM users WHERE username = $username;`);
    const createUserQuery = db.query(`INSERT INTO users (username, password) VALUES ($username, $password);`);

    return new Elysia()
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
                    .post('/auth/sign-up', async ({ body: { username, password }, jwt, cookie: { auth } }) => {
                        const user = getUserQuery.get({ $username: username }) as user | null;
                        if (user) {
                            return "User already exists"
                        }

                        try {
                            createUserQuery.run({ $username: username, $password: await Bun.password.hash(password) })

                            const user = getUserQuery.get({ $username: username }) as user | null;
                            
                            if (!user) {
                                throw new Error();
                            }

                            auth.set({
                                value: await jwt.sign({ username, id: user.id }),
                                httpOnly: true,
                                maxAge: 7 * 86400
                            })

                            return `Signed up as ${username}`
                        } catch (e) {
                            log('Failed to sign up as ' + username)

                            return 'Failed to sign up'
                        }
                    })
                    .post(
                        '/auth/sign-in',
                        async ({ body: { username, password }, jwt, cookie }) => {
                            const user = getUserQuery.get({ $username: username }) as user | null;
                            if (!user) {
                                return "No such user"
                            }

                            if (!(await Bun.password.verify(password, user.password))) {
                                return 'Incorrect password'
                            }

                            cookie.auth.set({
                                value: await jwt.sign({ username, id: user.id}),
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
                    .get('/auth/profile', async ({ jwt: { verify }, cookie: { auth: { value } } }) => await verify(value))
                    .get('/auth/sign-out', async ({ cookie: { auth } }) => {
                        auth.remove();

                        return 'Signed out';
                    })
        )
}

export async function isLoggedIn({ jwt: { verify }, cookie: { auth } }: {
    jwt: {
        verify: (value: string) => Promise<false | authCookie>
    },
    cookie: Record<string, Cookie<string>>
}): Promise<void | ErrorResponse> {
    if (await verify(auth.value) === false) {
        return error('authentication', 'cookies', null, 'Unathorized access')
    }
}

export type authCookie = {
    username: string,
    id: number
}