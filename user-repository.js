import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { SALT_ROUNDS } from "./config.js";
import { readJSON, writeJSON, httpError } from "./helpers.js";

const FILE = "./db/users.json";
const ROLES = ["admin", "user"];

// Còpia de l'usuari sense el password
const publicUser = ({ password, ...rest }) => rest;

export class UserRepository {
    static getAll() {
        return readJSON(FILE).map(publicUser);
    }

    static getById(id) {
        const user = readJSON(FILE).find((u) => u.id === id);
        return user ? publicUser(user) : null;
    }

    static async create({ username, password, role }) {
        Validation.username(username);
        Validation.password(password);

        const users = readJSON(FILE);
        if (users.some((u) => u.username === username)) {
            throw httpError("L'usuari ja existeix", 409);
        }

        // El primer usuari registrat és administrador; la resta, "user"
        const finalRole = users.length === 0 ? "admin" : role ?? "user";
        Validation.role(finalRole);

        const user = {
            id: crypto.randomUUID(),
            username,
            password: await bcrypt.hash(password, SALT_ROUNDS),
            role: finalRole
        };
        users.push(user);
        writeJSON(FILE, users);
        return publicUser(user);
    }

    static async login({ username, password }) {
        Validation.username(username);
        Validation.password(password);

        const user = readJSON(FILE).find((u) => u.username === username);
        // Missatge genèric: no diem si falla l'usuari o la contrasenya
        if (!user) throw httpError("Usuari o contrasenya incorrectes", 401);

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw httpError("Usuari o contrasenya incorrectes", 401);

        return publicUser(user);
    }

    static async update(id, { username, password, role }) {
        const users = readJSON(FILE);
        const user = users.find((u) => u.id === id);
        if (!user) return null;

        if (username !== undefined && username !== user.username) {
            Validation.username(username);
            if (users.some((u) => u.username === username)) {
                throw httpError("L'usuari ja existeix", 409);
            }
            user.username = username;
        }
        if (password) {
            Validation.password(password);
            user.password = await bcrypt.hash(password, SALT_ROUNDS);
        }
        if (role !== undefined) {
            Validation.role(role);
            user.role = role;
        }
        writeJSON(FILE, users);
        return publicUser(user);
    }

    static delete(id) {
        const users = readJSON(FILE);
        const rest = users.filter((u) => u.id !== id);
        if (rest.length === users.length) return false;
        writeJSON(FILE, rest);
        return true;
    }
}

class Validation {
    static username(username) {
        if (typeof username !== "string") throw httpError("El username ha de ser text");
        if (username.length < 3) throw httpError("El username ha de tenir 3 caràcters o més");
    }
    static password(password) {
        if (typeof password !== "string") throw httpError("La contrasenya ha de ser text");
        if (password.length < 6) throw httpError("La contrasenya ha de tenir 6 caràcters o més");
    }
    static role(role) {
        if (!ROLES.includes(role)) throw httpError("Rol no vàlid (admin o user)");
    }
}
