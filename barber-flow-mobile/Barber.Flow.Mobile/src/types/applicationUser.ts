export interface ApplicationUser {
	id: string;
	name: string;
	email: string;
	userName: string;
	password?: string;
	role: string;
	token: string;
	refreshToken?: string;
}
