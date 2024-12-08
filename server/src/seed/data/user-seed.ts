import * as bcrypt from 'bcrypt';

const users = [
  {
    email: 'adminius@mail.ru',
    password: bcrypt.hashSync('adminius', 10),
    role: 'admin',
    isActivated: true,
  },
];
export default users;
