
export const logout=async(req,res)=>{
    try {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOption = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      expires: new Date(0),
    };
    return res.cookie('token', '', cookieOption).status(200).json({
      message: 'Logged out successfully',
      success: true,
    });
    } catch (error) {
      return res.status(500).json({
        message:error.message || error,
        error:true
      } )
    }
}