module.exports = (sequelize, DataTypes) => {
  const GraphQLSchema = sequelize.define('GraphQLSchema', {
    schema: DataTypes.TEXT
  })

  return GraphQLSchema
}
