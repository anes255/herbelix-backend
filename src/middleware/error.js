// 404 handler
export function notFound(req, res) {
  res.status(404).json({ error: "المسار غير موجود" });
}

// Central error handler — never leaks stack traces to the client.
export function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error:
      status === 500 ? "حدث خطأ في الخادم" : err.publicMessage || "طلب غير صالح",
  });
}
