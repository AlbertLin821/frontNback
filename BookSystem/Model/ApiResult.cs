
namespace BookSystem.Model
{
    public class ApiResult<T>
    {
        public bool Status { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
    }
}
