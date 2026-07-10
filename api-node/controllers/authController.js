const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  // En un escenario real, validaríamos usuario y contraseña.
  // Aquí, simplemente generamos un token para demostrar JWT.
  const payload = {
    user: 'test_user',
    role: 'admin'
  };

  const secret = process.env.JWT_SECRET || 'supersecret123';
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  res.json({ token });
};
