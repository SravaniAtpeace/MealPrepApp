import mongoose from 'mongoose'

const IngredientSchema = new mongoose.Schema({ 
    name :{
      type: String,
      unique: true, // This creates the unique index in MongoDB
      required: true,
      lowercase: true,
      trim: true
    },
    aliases: {
      type: [String], 
      default: []
    },
    defaultUnit: { 
      type: String,
      default: null 
    },
    category: { 
      type: String, 
      default: null 
    }
}, {timestamps: true}); 

IngredientSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Ingredient', IngredientSchema);