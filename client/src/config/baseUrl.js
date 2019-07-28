const BASE_URL =
    process.env.NODE_ENV === "production"
        ? "<insert-production-url>"
        : "http://localhost:8080";
export default BASE_URL;