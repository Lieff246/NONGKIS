import mongoose from '#config/mongo'

const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: [true, 'Place is required'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema)
