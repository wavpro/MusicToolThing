import { jwt } from '@elysiajs/jwt'
import { Cookie, Elysia, t } from 'elysia';
import type { Database } from "bun:sqlite";
import type { user } from '../../data/database.sqlite.ts';
import { log } from '../logging/index.ts';
import { error, type ErrorResponse } from '../response/error.ts';
import { response } from '../response/response.ts';

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
                            return error("validation", "body", "username", "Username is already taken");
                        }

                        const [passwordValid, passwordValidReason] = validatePassword(password);
                        if (!passwordValid) {
                            return error("validation", "body", "password", passwordValidReason);
                        }

                        try {
                            createUserQuery.run({ $username: username, $password: await Bun.password.hash(password) })

                            const user = getUserQuery.get({ $username: username }) as user | null;
                            
                            if (!user) {
                                throw new Error("No such user after createUserQuery");
                            }

                            const profile = { username, id: user.id };

                            auth.set({
                                value: await jwt.sign(profile),
                                httpOnly: true,
                                maxAge: 7 * 86400
                            })

                            return response('', profile, '/');
                        } catch (e) {
                            log((e as Error).toString());

                            return error("server", "internal", null, "Failed to sign up timestamp " + new Date().toString());
                        }
                    })
                    .post(
                        '/auth/sign-in',
                        async ({ body: { username, password }, jwt, cookie }) => {
                            const user = getUserQuery.get({ $username: username }) as user | null;

                            if (!user || !(await Bun.password.verify(password, user.password))) {
                                return error("validation", "body", "username|password", "Invalid username or password")
                            }

                            const profile = { username, id: user.id };

                            cookie.auth.set({
                                value: await jwt.sign(profile),
                                httpOnly: false,
                                maxAge: 7 * 86400
                            });

                            return response('', profile, "/");
                        }
                    )
        )
        .guard(
            {
                beforeHandle: async ({ jwt: { verify }, cookie: { auth } }) => {
                    if (!await verify(auth.value)) {
                        return error("authentication", "cookies", null, "Unathorized access");
                    }
                }
            },
            (app) =>
                app
                    .get('/auth/profile', async ({ jwt: { verify }, cookie: { auth: { value } } }) => {
                        const profile = await verify(value);
                        if (!profile) {
                            return error("authentication", "cookies", null, "Invalid JWT token");
                        }

                        return response('', profile);
                    })
                    .post('/auth/sign-out', async ({ cookie: { auth } }) => {
                        auth.remove();

                        return response('', {});
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

function validatePassword(password: string): [boolean, string] {
    const result: [boolean, string] = [true, 'Password is valid'];

    if (password.length < 7) {
        result[0] = false;
        result[1] = 'Password should be at least 7 characters long';
    }
    if (password.length > 1024) {
        result[0] = false;
        result[1] = 'Password should not exceed 1024 characters';
    }

    // Add more checks for password viability/security

    return result;
}

export type authCookie = {
    username: string,
    id: number
}