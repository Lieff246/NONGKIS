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
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    category: {
      type: String,
      enum: ['nongkrong', 'belajar', 'diskusi'],
      default: 'nongkrong'
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/300x200?text=Tempat+Nongkrong'
    },
    capacity: {
      type: Number,
      default: 10
    },
    openHours: {
      type: String,
      default: '08:00'
    },
    closeHours: {
      type: String,
      default: '22:00'
    },
    coordinates: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    }
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema)
