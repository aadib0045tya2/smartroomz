const imageSet = (number) => [1, 2, 3].map((image) => `/properties/property-${number}-${image}.webp`)

export const properties = [
  {
    id: 'midtown-howell-mill', title: 'Midtown Howell Mill', area: 'Midtown', city: 'Atlanta', state: 'GA', zip: '30318',
    images: imageSet(1), weeklyPrice: 250, biweeklyPrice: 500, monthlyPrice: 1000, deposit: 175, applicationFee: 50,
    roomType: 'Private room', availability: 'Available now', earliestMoveInDate: '2026-08-18',
    amenities: ['Furnished room', 'High-speed Wi-Fi', 'Washer & dryer', 'Shared kitchen', 'Utilities included', 'Keyless entry'],
    description: 'A bright furnished private room near Howell Mill with flexible payments and comfortable shared spaces. Ideal for renters who want a simple application and a fast move-in.',
    rating: 4.9, featured: true, latitude: 33.786, longitude: -84.412,
  },
  {
    id: 'boulevard-midtown', title: 'Boulevard Midtown', area: 'Midtown', city: 'Atlanta', state: 'GA', zip: '30312',
    images: imageSet(2), weeklyPrice: 250, biweeklyPrice: 500, monthlyPrice: 1000, deposit: 175, applicationFee: 50,
    roomType: 'Private room', availability: 'Fast move-in', earliestMoveInDate: '2026-08-20',
    amenities: ['Fully furnished', 'Wi-Fi', 'Central air', 'Shared lounge', 'Flexible payments', 'Street parking'],
    description: 'A conveniently located private room in a shared Smart Roomz home near Midtown Atlanta, with furnished common spaces and flexible stay options.',
    rating: 4.8, featured: true, latitude: 33.77, longitude: -84.371,
  },
  {
    id: 'santa-barbara', title: 'Santa Barbara Drive', area: 'Decatur', city: 'Decatur', state: 'GA', zip: '30032',
    images: imageSet(3), weeklyPrice: 163, biweeklyPrice: 325, monthlyPrice: 650, deposit: 175, applicationFee: 50,
    roomType: 'Private room', availability: 'Available now', earliestMoveInDate: '2026-08-17',
    amenities: ['Furnished room', 'Wi-Fi', 'Utilities included', 'Shared kitchen', 'On-site laundry', 'Quiet neighborhood'],
    description: 'A value-focused furnished room in Decatur with flexible payment options, welcoming shared areas, and Smart Roomz member screening.',
    rating: 4.7, featured: false, latitude: 33.725, longitude: -84.283,
  },
  {
    id: 'mountain-view-pass', title: 'Mountain View Pass', area: 'Stone Mountain', city: 'Stone Mountain', state: 'GA', zip: '30087',
    images: imageSet(4), weeklyPrice: 194, biweeklyPrice: 388, monthlyPrice: 776, deposit: 175, applicationFee: 50,
    roomType: 'Private room', availability: 'Available', earliestMoveInDate: '2026-08-25',
    amenities: ['Furnished room', 'Wi-Fi', 'Backyard', 'Shared kitchen', 'Laundry access', 'Driveway parking'],
    description: 'A furnished private room in Stone Mountain with relaxed shared spaces, practical home amenities, and flexible stay options.',
    rating: 4.8, featured: false, latitude: 33.77, longitude: -84.14,
  },
  {
    id: 'ormond-street', title: 'Ormond Street SW', area: 'Atlanta', city: 'Atlanta', state: 'GA', zip: '30315',
    images: imageSet(5), weeklyPrice: 200, biweeklyPrice: 400, monthlyPrice: 800, deposit: 175, applicationFee: 50,
    roomType: 'Private room', availability: 'Ready to move in', earliestMoveInDate: '2026-08-17',
    amenities: ['Furnished room', 'Wi-Fi', 'Utilities included', 'Shared kitchen', 'Central air', 'Transit nearby'],
    description: 'A practical private room in Atlanta for renters who want a furnished stay and a faster alternative to a traditional apartment lease.',
    rating: 4.6, featured: false, latitude: 33.731, longitude: -84.395,
  },
  {
    id: 'ellenwood-suite', title: 'Ellenwood Traditional Suite', area: 'Ellenwood', city: 'Ellenwood', state: 'GA', zip: '30294',
    images: imageSet(6), weeklyPrice: 200, biweeklyPrice: 400, monthlyPrice: 800, deposit: 175, applicationFee: 50,
    roomType: 'Private suite', availability: 'Fast move-in', earliestMoveInDate: '2026-08-19',
    amenities: ['Private suite', 'Wi-Fi', 'Workspace', 'Shared kitchen', 'Laundry access', 'Off-street parking'],
    description: 'A comfortable furnished suite in Ellenwood with flexible stay options, generous shared spaces, and a straightforward move-in process.',
    rating: 4.9, featured: true, latitude: 33.61, longitude: -84.28,
  },
]

export const paymentPlans = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
]
