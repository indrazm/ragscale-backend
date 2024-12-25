import { Elysia, t } from "elysia";
import { authService } from "../../application/instances";

export const authRouter = new Elysia()
	.post(
		"/register",
		async ({ body, set }) => {
			const { username, email, password } = body;

			const data = await authService.register(username, email, password);

			if (!data) {
				set.status = 400;
				return { message: "Register failed!" };
			}

			set.status = 201;
			return {
				message: "Register success!",
				data: {
					user: {
						username: data.newUser.username,
						email: data.newUser.email,
					},
				},
			};
		},
		{
			body: t.Object({
				username: t.String(),
				email: t.String({
					format: "email",
				}),
				password: t.String({
					minLength: 8,
				}),
			}),
		},
	)
	.post(
		"/login",
		async ({ body, set }) => {
			const { email, password } = body;

			const data = await authService.login(email, password);

			if (!data) {
				set.status = 400;
				return { message: "Invalid Credentials" };
			}

			return {
				message: "Login successfully",
				data: {
					sessionId: data.session.id,
					user: {
						username: data.user.username,
						email: data.user.email,
					},
				},
			};
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 8 }),
			}),
		},
	);
