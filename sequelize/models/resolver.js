module.exports = (sequelize, DataTypes) => {
  const Resolver = sequelize.define('Resolver', {
    type: DataTypes.STRING,
    field: DataTypes.STRING,
    requestMapping: DataTypes.STRING,
    responseMapping: DataTypes.STRING
  })

  Resolver.associate = (models) => {
    models.Resolver.belongsTo(models.DataSource, {
      onDelete: 'CASCADE',
      foreignKey: {
        allowNull: false
      }
    })
  }

  return Resolver
}
