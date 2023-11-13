const { User } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      // context can never be the 2nd argument - it has to be the 3rd
      //_args we are saying '_' is a placeholder, just sending something
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("books");
      }
      throw AuthenticationError;
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },
    saveBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args.input } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("Something is wrong!");
    },

    removeBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("Something is wrong!");
    },
  },
};

module.exports = resolvers;
