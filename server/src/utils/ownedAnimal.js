import Animal from '../models/Animal.js';
import { AppError } from './appError.js';

// Finds an animal that belongs to the logged-in farmer, or throws 404.
export async function findOwnedAnimal(ownerId, animalId) {
  const animal = await Animal.findOne({ _id: animalId, owner: ownerId });
  if (!animal) throw new AppError(404, 'ANIMAL_NOT_FOUND', 'Animal not found');
  return animal;
}
