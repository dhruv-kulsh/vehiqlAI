import { toast } from "sonner";

const { useState } = require("react")

const useFetch = (cb) => {
    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState(null);

    const fn = async (...arg) => {
        setLoading(true);
        setError(null);

        try {
            const response = await cb(...arg);
            setData(response);
            setError(null);
            return response;
        } catch (error) {
            setError(error);
            toast.error(error.message);
            // Re-throw so callers can catch and we can see stack traces in client code
            throw error;

        }
        finally {
            setLoading(false);
        }

    };

    return { data, loading, error, fn, setData }
}

export default useFetch;