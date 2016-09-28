
module.exports = (res, url, status) => {
  res.statusCode = status || 302;
  res.setHeader('Location', url);
  res.setHeader('Content-Length', '0');
  //return res.end();
};