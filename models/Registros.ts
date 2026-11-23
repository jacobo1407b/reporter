import mongoose, { Schema, model, models } from 'mongoose';

const RegistroSchema = new Schema({
    nombre: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    last_login: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

export const Registro = models.Registro || model('Registro', RegistroSchema);
