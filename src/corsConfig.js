const allowedOrigins = ["https://example.com", "https://anotherdomain.com"];

const corsOptions = {
    /* origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }, */
    origin: '*',
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "multipart/form-data",
    ],
    credentials: true,
    optionsSuccessStatus: 204, // Prevents legacy browsers from issues
};

module.exports = corsOptions;

// Enable CORS with options
  

/* export const corsEnable = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
	res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Content-Range, Content-Disposition, Content-Description,  Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, multipart/form-data");

    cors({
        exposedHeaders: ['X-Sub-Domain']
    });
    console.log("CORS ENABLED");
    next();
}; */
