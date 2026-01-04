using Dapper;
using Microsoft.Data.SqlClient;

namespace BookSystem.Model
{
    public class CodeService
    {
        private string GetDBConnectionString()
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .Build();

            return config.GetConnectionString("DBConn");
        }
        public List<Code> GetBookStatusData()
        {
            var result = new List<Code>();
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = "Select CODE_ID As Value,CODE_NAME As Text From BOOK_CODE Where CODE_TYPE=@CODE_TYPE";
                Dictionary<string, Object> parameter = new Dictionary<string, object>();
                parameter.Add("@CODE_TYPE", "BOOK_STATUS");
                result = conn.Query<Code>(sql, parameter).ToList();
            }
            return result;
        }

    }
}
