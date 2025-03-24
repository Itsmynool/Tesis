import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  devices: [{ type: String }], // Lista de dispositivos que el usuario puede ver
});

export default mongoose.model('User', userSchema);