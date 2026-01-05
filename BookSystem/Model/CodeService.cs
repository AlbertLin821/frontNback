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

            return config.GetConnectionString("DBConn") ?? string.Empty;
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

        public List<Code> GetBookClassData()
        {
            var result = new List<Code>();
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = "Select BOOK_CLASS_ID As Value,BOOK_CLASS_NAME As Text From BOOK_CLASS";
                result = conn.Query<Code>(sql).ToList();
            }
            return result;
        }

        public List<Member> GetMemberData()
        {
            var result = new List<Member>();
            using (SqlConnection conn = new SqlConnection(GetDBConnectionString()))
            {
                string sql = "Select USER_ID As UserId,USER_CNAME As UserCname,USER_ENAME As UserEname From MEMBER_M";
                result = conn.Query<Member>(sql).ToList();
            }
            return result;
        }

    }
}
