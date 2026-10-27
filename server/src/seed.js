import { assertEnv, env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { User } from './models/User.js';
import { Movie } from './models/Movie.js';
import { Theatre } from './models/Theatre.js';
import { Showtime } from './models/Showtime.js';
import { Booking } from './models/Booking.js';
import { calculateTotal, createBookingReference } from './utils/seats.js';

const POSTER = (fileName) => `/posters/${fileName}`;

const MOVIES = [
  {
    title: 'Neon Horizon',
    description:
      'A courier pilot smuggles a stolen memory across a rain-soaked megacity, only to discover it holds the blueprint of the city itself.',
    posterUrl: POSTER('dune_2.jpg'),
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    genres: ['Sci-Fi', 'Thriller'],
    languages: ['English', 'Hindi'],
    durationMinutes: 128,
    releaseDate: new Date('2026-09-18'),
    rating: 8.4,
    certificate: 'UA',
    status: 'now_showing',
    director: 'Aria Kulkarni',
    cast: ['Dev Malhotra', 'Ines Ferreira', 'Kabir Rao'],
  },
  {
    title: 'The Last Monsoon',
    description:
      'Three siblings return to their flooded family home to settle an inheritance and end up rebuilding a life they thought was over.',
    posterUrl: POSTER('pride_of_bharat.jpg'),
    genres: ['Drama', 'Family'],
    languages: ['Hindi', 'Marathi'],
    durationMinutes: 142,
    releaseDate: new Date('2026-08-29'),
    rating: 8.1,
    certificate: 'U',
    status: 'now_showing',
    director: 'Meera Joshi',
    cast: ['Sanya Deshpande', 'Rohit Iyer', 'Anaya Shaikh'],
  },
  {
    title: 'Midnight Circuit',
    description:
      'A late-night radio host starts receiving calls from a caller who can describe crimes before they happen.',
    posterUrl: POSTER('og.jpg'),
    genres: ['Thriller', 'Mystery'],
    languages: ['English'],
    durationMinutes: 116,
    releaseDate: new Date('2026-10-02'),
    rating: 7.9,
    certificate: 'A',
    status: 'now_showing',
    director: 'Leo Fernandes',
    cast: ['Nikhil Bhat', 'Tara Menon'],
  },
  {
    title: 'Paper Lanterns',
    description:
      'Two strangers keep meeting at the same festival every year, never quite finding the right moment to stay.',
    posterUrl: POSTER('avatar.jpg'),
    genres: ['Romance', 'Drama'],
    languages: ['Hindi', 'English'],
    durationMinutes: 124,
    releaseDate: new Date('2026-09-11'),
    rating: 7.6,
    certificate: 'UA',
    status: 'now_showing',
    director: 'Riya Sen',
    cast: ['Aditya Verma', 'Naina Kapoor'],
  },
  {
    title: 'Iron Valley',
    description:
      'A retired stunt driver is pulled back for one last job: moving a witness across a desert in a car that should not exist.',
    posterUrl: POSTER('baaghi4.jpg'),
    genres: ['Action', 'Crime'],
    languages: ['English', 'Tamil'],
    durationMinutes: 134,
    releaseDate: new Date('2026-09-26'),
    rating: 8.0,
    certificate: 'A',
    status: 'now_showing',
    director: 'Vikram Sethi',
    cast: ['Arjun Nair', 'Lila Dsouza', 'Omar Qureshi'],
  },
  {
    title: 'Laugh Track',
    description:
      'A failing sitcom writer discovers that every joke he cuts from the script starts coming true in his own life.',
    posterUrl: POSTER('pushpa_2.jpg'),
    genres: ['Comedy'],
    languages: ['English', 'Hindi'],
    durationMinutes: 108,
    releaseDate: new Date('2026-10-09'),
    rating: 7.2,
    certificate: 'UA',
    status: 'now_showing',
    director: 'Priya Raghavan',
    cast: ['Sameer Gupta', 'Zoya Khan'],
  },
  {
    title: 'The Quiet Deep',
    description:
      'A salvage crew investigating a sunken research station finds the crew logs still recording.',
    posterUrl: POSTER('toxic.jpg'),
    genres: ['Horror', 'Mystery'],
    languages: ['English'],
    durationMinutes: 101,
    releaseDate: new Date('2026-10-16'),
    rating: 7.4,
    certificate: 'A',
    status: 'now_showing',
    director: 'Hana Okafor',
    cast: ['Elena Marsh', 'Tomas Reyes'],
  },
  {
    title: 'Skyward Bound',
    description:
      'A young mapmaker and a grumpy hot-air balloon captain race to chart a floating island before it drifts away forever.',
    posterUrl: POSTER('ramayana.jpg'),
    genres: ['Animation', 'Adventure', 'Family'],
    languages: ['English', 'Hindi'],
    durationMinutes: 96,
    releaseDate: new Date('2026-12-18'),
    rating: 0,
    certificate: 'U',
    status: 'coming_soon',
    director: 'Joel Tan',
    cast: ['Maya Lin', 'Gideon Park'],
  },
];

const THEATRES = [
  {
    name: 'PVR Icon, Andheri',
    city: 'Mumbai',
    address: '4th Floor, Infiniti Mall, Andheri West',
    screens: [
      { name: 'Audi 1', rows: 8, seatsPerRow: 10, format: '2D' },
      { name: 'Audi 2', rows: 6, seatsPerRow: 8, format: '3D' },
      { name: 'IMAX Screen', rows: 10, seatsPerRow: 12, format: 'IMAX' },
    ],
  },
  {
    name: 'INOX Grand, Marine Lines',
    city: 'Mumbai',
    address: 'Ground Floor, Metro Junction, Marine Lines',
    screens: [
      { name: 'Screen 1', rows: 7, seatsPerRow: 9, format: '2D' },
      { name: 'Screen 2', rows: 7, seatsPerRow: 9, format: '3D' },
    ],
  },
  {
    name: 'Cinepolis Central',
    city: 'Pune',
    address: '2nd Floor, Seasons Mall, Magarpatta',
    screens: [
      { name: 'Luxe 1', rows: 9, seatsPerRow: 10, format: '2D' },
      { name: 'Luxe 2', rows: 6, seatsPerRow: 8, format: '3D' },
    ],
  },
];

function at(daysFromNow, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function priceFor(format) {
  if (format === 'IMAX') return 480;
  if (format === '3D') return 360;
  return 250;
}

async function seed() {
  assertEnv();
  await connectDb();

  console.log('Clearing existing data...');
  await Promise.all([
    Booking.deleteMany({}),
    Showtime.deleteMany({}),
    Theatre.deleteMany({}),
    Movie.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log('Creating users...');
  const admin = await User.create({
    name: env.admin.name,
    email: env.admin.email,
    password: env.admin.password,
    role: 'admin',
  });

  const customer = await User.create({
    name: 'Demo Customer',
    email: 'demo@imovies.test',
    password: 'Demo@12345',
    role: 'customer',
  });

  console.log('Creating movies...');
  const movies = await Movie.insertMany(MOVIES);
  const nowShowing = movies.filter((movie) => movie.status === 'now_showing');

  console.log('Creating theatres...');
  const theatres = await Theatre.create(THEATRES);

  console.log('Creating showtimes...');
  const times = [
    [10, 30],
    [14, 0],
    [18, 30],
    [21, 45],
  ];
  const showtimeDocs = [];

  for (let day = 0; day < 5; day += 1) {
    for (let index = 0; index < nowShowing.length; index += 1) {
      const movie = nowShowing[index];
      const theatre = theatres[index % theatres.length];
      const screen = theatre.screens[index % theatre.screens.length];
      const [hour, minute] = times[index % times.length];

      showtimeDocs.push({
        movie: movie._id,
        theatre: theatre._id,
        screenId: screen._id,
        startTime: at(day, hour, minute),
        ticketPrice: priceFor(screen.format),
        language: movie.languages[0] ?? 'English',
        format: screen.format,
        status: 'scheduled',
      });

      if (day < 2) {
        const secondScreen = theatre.screens[(index + 1) % theatre.screens.length];
        showtimeDocs.push({
          movie: movie._id,
          theatre: theatre._id,
          screenId: secondScreen._id,
          startTime: at(day, (hour + 4) % 24, minute),
          ticketPrice: priceFor(secondScreen.format),
          language: movie.languages[0] ?? 'English',
          format: secondScreen.format,
          status: 'scheduled',
        });
      }
    }
  }

  const showtimes = await Showtime.insertMany(showtimeDocs);

  console.log('Creating demo bookings...');
  const demoShowtime = showtimes[0];

  await Booking.create([
    {
      reference: createBookingReference(),
      user: customer._id,
      showtime: demoShowtime._id,
      movie: demoShowtime.movie,
      theatre: demoShowtime.theatre,
      seats: ['A3', 'A4'],
      totalAmount: calculateTotal(demoShowtime.ticketPrice, 2),
      status: 'confirmed',
    },
    {
      reference: createBookingReference(),
      user: admin._id,
      showtime: demoShowtime._id,
      movie: demoShowtime.movie,
      theatre: demoShowtime.theatre,
      seats: ['B6', 'B7', 'B8'],
      totalAmount: calculateTotal(demoShowtime.ticketPrice, 3),
      status: 'confirmed',
    },
  ]);

  console.log('\nSeed complete.');
  console.log(`  Movies: ${movies.length}`);
  console.log(`  Theatres: ${theatres.length}`);
  console.log(`  Showtimes: ${showtimes.length}`);
  console.log('\nAccounts');
  console.log(`  Admin    ${env.admin.email} / ${env.admin.password}`);
  console.log('  Customer demo@imovies.test / Demo@12345');

  await disconnectDb();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
