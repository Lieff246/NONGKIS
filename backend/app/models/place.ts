import mongoose from '#config/mongo'

const PlaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('Place', PlaceSchema)
