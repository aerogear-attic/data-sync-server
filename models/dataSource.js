module.exports = (sequelize, DataTypes) => {
  const DataSource = sequelize.define('DataSource', {
    name: DataTypes.STRING,
    type: DataTypes.ENUM('InMemory', 'Postgres'),
    config: DataTypes.JSON
  })

  DataSource.associate = function (models) {
    models.DataSource.hasMany(models.Resolver)
  }

  return DataSource
}
