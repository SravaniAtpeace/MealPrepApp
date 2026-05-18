import mongoose from 'mongoose'

/* 
    1. The Parentheses ()They belong to the constructor function new mongoose.Schema().They tell JavaScript to execute the function and accept its parameters.
    
    2. The Curly Braces {}They define a JavaScript Object literal.Instead of creating a separate variable for your configuration, you write the object directly inside the function call.
*/

const RecipeSchema = new mongoose.Schema({
  _id,
  name: String,                       // TranslatedRecipeName
  ingredientsRaw: String,             // TranslatedIngredients (verbatim, comma-separated)
  ingredientsParsed: [{               // best-effort tokenization for grocery aggregation + filtering
    name: String, qty: Number, unit: String, raw: String
  }],
  prepTimeMins: Number,
  cookTimeMins: Number,
  totalTimeMins: Number,
  servings: Number,
  cuisine: String,                    // e.g., "South Indian", "Continental"
  course: String,                     // mapped to meal slot — see §4.2
  diet: String,                       // enum, see §4.3
  instructions: String,               // TranslatedInstructions
}, {timestamps: true});

RecipeSchema.index({ name: 'text', ingredientsRaw: 'text' });
RecipeSchema.index({ course: 1 }); // 1 - ascending; -1 - descending
RecipeSchema.index({ diet: 1 });
RecipeSchema.index({ cuisine: 1 });
RecipeSchema.index({ totalTimeMins: 1 });

export default mongoose.model('Recipe', RecipeSchema);