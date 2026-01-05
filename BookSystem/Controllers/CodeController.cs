using BookSystem.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using System.Linq;

namespace BookSystem.Controllers
{

    [Route("api/code")]
    [ApiController]
    public class CodeController : ControllerBase
    {

        [Route("bookstatus")]
        [HttpPost()]
        public IActionResult GetBookStatusData()
        {
            try
            {
                CodeService codeService = new CodeService();
                ApiResult<List<Code>> result = new ApiResult<List<Code>>()
                {
                    Data = codeService.GetBookStatusData(),
                    Status = true,
                    Message = string.Empty
                };

                return Ok(result);
            }
            catch (Exception)
            {

                return Problem();
            }
        }
        
        [Route("bookclass")]
        [HttpPost()]
        public IActionResult GetBookClassData()
        {
            try
            {
                CodeService codeService = new CodeService();
                ApiResult<List<Code>> result = new ApiResult<List<Code>>()
                {
                    Data = codeService.GetBookClassData(),
                    Status = true,
                    Message = string.Empty
                };

                return Ok(result);
            }
            catch (Exception)
            {
                return Problem();
            }
        }

        [Route("member")]
        [HttpPost()]
        public IActionResult GetMemberData()
        {
            try
            {
                CodeService codeService = new CodeService();
                var memberList = codeService.GetMemberData();
                
                var codeList = memberList.Select(m => new Code
                {
                    Value = m.UserId,
                    Text = m.UserCname
                }).ToList();
                
                ApiResult<List<Code>> result = new ApiResult<List<Code>>()
                {
                    Data = codeList,
                    Status = true,
                    Message = string.Empty
                };

                return Ok(result);
            }
            catch (Exception)
            {
                return Problem();
            }
        }

    }
}
