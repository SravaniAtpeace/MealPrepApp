const IngredientSchema = new mongoose.Schema({ 
    name :{
      type: String,
      unique: true, // This creates the unique index in MongoDB
      required: true
    },
    alias: String,
    defaultUnit: { 
      type: String,
      default: null 
    },
    category: { 
      type: String, 
      default: null 
    }
}); 

IngredientSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Ingredient', IngredientSchema);