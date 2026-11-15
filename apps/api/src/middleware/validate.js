export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      if (schema?.shape && (schema.shape.body || schema.shape.query || schema.shape.params)) {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
      } else {
        const parsed = await schema.parseAsync(req[source]);
        req[source] = parsed;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default validate;
