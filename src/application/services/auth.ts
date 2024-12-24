import type { SessionRepositories } from "../../infrastructure/repositories/session";
import type { UserRepositories } from "../../infrastructure/repositories/user";

export class AuthService {
	private userRepositories: UserRepositories;
	private sessionRepositories: SessionRepositories;

	constructor(userRepo: UserRepositories, sessionRepo: SessionRepositories) {
		this.userRepositories = userRepo;
		this.sessionRepositories = sessionRepo;
	}

	public async register(username: string, email: string, password: string) {
		const existedUser = await this.userRepositories.getUser(email);

		if (existedUser) {
			return null;
		}

		const hashedPassword = await Bun.password.hash(password);
		const newUser = await this.userRepositories.create({
			username,
			email,
			password: hashedPassword,
		});

		return { newUser };
	}

	public async login(email: string, password: string) {
		const user = await this.userRepositories.getUser(email);

		if (!user) {
			return null;
		}

		const isPasswordMatch = await Bun.password.verify(password, user.password);

		if (!isPasswordMatch) {
			return null;
		}

		const currentSession = await this.sessionRepositories.getSession(user.id);

		if (currentSession) {
			await this.sessionRepositories.delete(currentSession.id);
		}

		const newSession = await this.sessionRepositories.create(user.id);

		return { session: newSession };
	}
}
